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
            // No schema change: SQLite cannot DropColumn via EF, and the unused
            // WhatsappNumber column is cleared by the API on save instead.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
