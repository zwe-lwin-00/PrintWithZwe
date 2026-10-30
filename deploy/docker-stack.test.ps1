$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$identifier = 'pzw-test-' + [Guid]::NewGuid().ToString('N').Substring(0, 10)
$temporary = Join-Path ([System.IO.Path]::GetTempPath()) $identifier
$apiName = "$identifier-api"
$webName = "$identifier-web"
$network = "$identifier-network"
$dataRoot = Join-Path $temporary 'data'
$certificateRoot = Join-Path $temporary 'certificates'
$certificateLive = Join-Path $certificateRoot 'live/printwithzwe.test'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$apiIp = '172.29.231.3'
$webIp = '172.29.231.2'

function Invoke-Docker {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker command failed: $args" }
}

function Get-TestUrl {
    param([string]$Path, [switch]$AllowFailure)
    $result = & curl.exe --noproxy '*' --insecure --silent --show-error --fail `
        --retry 10 --retry-delay 1 --retry-all-errors --max-time 5 `
        --resolve 'printwithzwe.test:18443:127.0.0.1' "https://printwithzwe.test:18443$Path"
    if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) { throw "HTTPS check failed: $Path" }
    return $result
}

function Start-TestApi {
    Invoke-Docker run -d --name $apiName --network $network --ip $apiIp `
        --user '999:33' --read-only --tmpfs '/tmp:rw,noexec,nosuid,size=32m' `
        --cap-drop ALL --security-opt 'no-new-privileges:true' --pids-limit 100 --memory 512m `
        --mount "type=bind,source=$dataRoot,target=/var/lib/printwithzwe" `
        -e 'AllowedHosts=printwithzwe.test' -e "ReverseProxy__TrustedProxy=$webIp" `
        printwithzwe-api:verification | Out-Null
}

try {
    New-Item -ItemType Directory -Force -Path $dataRoot, $certificateLive, `
        (Join-Path $certificateRoot 'archive'), (Join-Path $temporary 'acme') | Out-Null
    $rsa = [System.Security.Cryptography.RSA]::Create(2048)
    $request = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
        'CN=printwithzwe.test', $rsa, [System.Security.Cryptography.HashAlgorithmName]::SHA256,
        [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
    $san = [System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
    $san.AddDnsName('printwithzwe.test')
    $request.CertificateExtensions.Add($san.Build())
    $certificate = $request.CreateSelfSigned([DateTimeOffset]::UtcNow.AddMinutes(-1), [DateTimeOffset]::UtcNow.AddDays(1))
    [System.IO.File]::WriteAllText((Join-Path $certificateLive 'fullchain.pem'), $certificate.ExportCertificatePem(), $utf8)
    [System.IO.File]::WriteAllText((Join-Path $certificateLive 'privkey.pem'), $rsa.ExportPkcs8PrivateKeyPem(), $utf8)
    $certificate.Dispose()
    $rsa.Dispose()

    Invoke-Docker network create --subnet '172.29.231.0/29' $network | Out-Null
    Invoke-Docker run --rm --user '0:0' --entrypoint /bin/bash `
        --mount "type=bind,source=$dataRoot,target=/var/lib/printwithzwe" `
        printwithzwe-api:verification -c 'mkdir -p /var/lib/printwithzwe/uploads /var/lib/printwithzwe/keys; chown -R 999:33 /var/lib/printwithzwe; chmod 750 /var/lib/printwithzwe /var/lib/printwithzwe/uploads; chmod 700 /var/lib/printwithzwe/keys'
    Start-TestApi
    Invoke-Docker run -d --name $webName --network $network --ip $webIp `
        --read-only --tmpfs '/tmp:rw,noexec,nosuid,size=32m' `
        --cap-drop ALL --cap-add CHOWN --cap-add SETUID --cap-add SETGID `
        --security-opt 'no-new-privileges:true' --pids-limit 64 --memory 128m `
        -p '127.0.0.1:18443:8443' -p '127.0.0.1:18080:8080' `
        --mount "type=bind,source=$dataRoot/uploads,target=/srv/uploads,readonly" `
        --mount "type=bind,source=$certificateRoot/live,target=/etc/letsencrypt/live,readonly" `
        --mount "type=bind,source=$certificateRoot/archive,target=/etc/letsencrypt/archive,readonly" `
        --mount "type=bind,source=$temporary/acme,target=/var/www/acme,readonly" `
        -e 'PZW_PRIMARY_DOMAIN=printwithzwe.test' -e 'PZW_WWW_DOMAIN=www.printwithzwe.test' `
        -e 'PZW_CERT_NAME=printwithzwe.test' -e "PZW_API_PROXY_HOST=$apiIp" -e 'PZW_MAX_REQUEST_BODY=12m' `
        printwithzwe-web:verification | Out-Null

    $health = Get-TestUrl '/api/health' | ConvertFrom-Json
    if (-not $health.ok) { throw 'Health JSON is not healthy.' }
    Get-TestUrl '/api/products' | ConvertFrom-Json | Out-Null
    $html = (Get-TestUrl '/admin/login') -join "`n"
    if ($html -notmatch 'id="root"') { throw 'SPA route did not serve the application.' }
    Write-Output 'PASS: read-only HTTPS stack, API, products and SPA route'

    $assetName = '0123456789abcdef0123456789abcdef.webp'
    $assetPath = Join-Path $dataRoot "uploads/$assetName"
    $assetBytes = [Convert]::FromBase64String('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA')
    [System.IO.File]::WriteAllBytes($assetPath, $assetBytes)
    Get-TestUrl "/uploads/$assetName" | Out-Null
    Write-Output 'PASS: persistent upload is served over HTTPS'

    Invoke-Docker exec $webName nginx -c /tmp/nginx.conf -t
    Invoke-Docker exec $webName nginx -c /tmp/nginx.conf -s reload
    Get-TestUrl '/api/health' | Out-Null
    Write-Output 'PASS: Nginx configuration check and live reload'

    Invoke-Docker stop $apiName | Out-Null
    if (-not (Test-Path (Join-Path $dataRoot 'catalog.db'))) { throw 'Persistent database is missing.' }
    Invoke-Docker start $apiName | Out-Null
    Get-TestUrl '/api/health' | Out-Null
    Write-Output 'PASS: API stop/start recovery'

    Invoke-Docker stop $apiName | Out-Null
    Invoke-Docker rm $apiName | Out-Null
    Start-TestApi
    Get-TestUrl '/api/health' | Out-Null
    Get-TestUrl '/api/products' | ConvertFrom-Json | Out-Null
    Get-TestUrl "/uploads/$assetName" | Out-Null
    Write-Output 'PASS: API container recreation preserves database and uploads'
}
catch {
    & docker logs --tail 60 $apiName
    & docker logs --tail 60 $webName
    throw
}
finally {
    & docker rm -f $webName $apiName 2>$null | Out-Null
    & docker network rm $network 2>$null | Out-Null
    if (Test-Path $temporary) { Remove-Item -Recurse -Force $temporary }
}