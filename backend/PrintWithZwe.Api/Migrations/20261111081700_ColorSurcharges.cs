using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PrintWithZwe.Api;

#nullable disable

namespace PrintWithZwe.Api.Migrations
{
    [DbContext(typeof(CatalogDb))]
    [Migration("20261111081700_ColorSurcharges")]
    public partial class ColorSurcharges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ColorSurcharge2PerGram",
                table: "PricingSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: 50m);

            migrationBuilder.AddColumn<decimal>(
                name: "ColorSurcharge3PerGram",
                table: "PricingSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: 90m);

            migrationBuilder.AddColumn<decimal>(
                name: "ColorSurcharge4PerGram",
                table: "PricingSettings",
                type: "TEXT",
                nullable: false,
                defaultValue: 120m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ColorSurcharge2PerGram",
                table: "PricingSettings");

            migrationBuilder.DropColumn(
                name: "ColorSurcharge3PerGram",
                table: "PricingSettings");

            migrationBuilder.DropColumn(
                name: "ColorSurcharge4PerGram",
                table: "PricingSettings");
        }
    }
}
