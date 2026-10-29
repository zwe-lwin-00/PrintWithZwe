using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintWithZwe.Api.Migrations
{
    /// <inheritdoc />
    public partial class SiteLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LocationUrl",
                table: "SiteSettings",
                type: "TEXT",
                maxLength: 2048,
                nullable: false,
                defaultValue: "https://maps.app.goo.gl/Fq5xDbNXvTAWbB8t5");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LocationUrl",
                table: "SiteSettings");
        }
    }
}
