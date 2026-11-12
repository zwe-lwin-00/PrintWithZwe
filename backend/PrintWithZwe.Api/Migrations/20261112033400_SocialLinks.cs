using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PrintWithZwe.Api;

#nullable disable

namespace PrintWithZwe.Api.Migrations
{
    [DbContext(typeof(CatalogDb))]
    [Migration("20261112033400_SocialLinks")]
    public partial class SocialLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TiktokUsername",
                table: "SiteSettings",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "printwithzwe2026");

            migrationBuilder.AddColumn<string>(
                name: "FacebookUrl",
                table: "SiteSettings",
                type: "TEXT",
                maxLength: 2048,
                nullable: false,
                defaultValue: "https://www.facebook.com/share/193HnfrGfk/?mibextid=wwXIfr");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // SQLite EF cannot DropColumn; leave columns in place on downgrade.
        }
    }
}
