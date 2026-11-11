using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PrintWithZwe.Api;

#nullable disable

namespace PrintWithZwe.Api.Migrations
{
    [DbContext(typeof(CatalogDb))]
    [Migration("20261111091000_RemoveWhatsappNumber")]
    public partial class RemoveWhatsappNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WhatsappNumber",
                table: "SiteSettings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WhatsappNumber",
                table: "SiteSettings",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");
        }
    }
}
