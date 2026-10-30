FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/PrintWithZwe.Api/PrintWithZwe.Api.csproj backend/PrintWithZwe.Api/
RUN dotnet restore backend/PrintWithZwe.Api/PrintWithZwe.Api.csproj
COPY backend/PrintWithZwe.Api/ backend/PrintWithZwe.Api/
RUN dotnet publish backend/PrintWithZwe.Api/PrintWithZwe.Api.csproj -c Release --no-restore -o /publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /publish/ ./
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://0.0.0.0:5000 \
    Storage__Root=/var/lib/printwithzwe \
    DOTNET_GCHeapHardLimit=0x10000000 \
    DOTNET_gcServer=0
USER $APP_UID
EXPOSE 5000
ENTRYPOINT ["/bin/sh", "-c", "umask 077; exec dotnet /app/PrintWithZwe.Api.dll \"$@\"", "--"]