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
            // SQLite cannot DropColumn through EF; clear stored WhatsApp values instead.
            migrationBuilder.Sql(
                """
                UPDATE "SiteSettings" SET "WhatsappNumber" = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
