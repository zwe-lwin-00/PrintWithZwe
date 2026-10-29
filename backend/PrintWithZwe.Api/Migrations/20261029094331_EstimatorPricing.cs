using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintWithZwe.Api.Migrations
{
    /// <inheritdoc />
    public partial class EstimatorPricing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PricingSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BaseFee = table.Column<decimal>(type: "TEXT", nullable: false),
                    MachineRatePerHour = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PricingSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MaterialRate",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    PricingSettingsId = table.Column<int>(type: "INTEGER", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    RatePerGram = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialRate", x => new { x.PricingSettingsId, x.Id });
                    table.ForeignKey(
                        name: "FK_MaterialRate_PricingSettings_PricingSettingsId",
                        column: x => x.PricingSettingsId,
                        principalTable: "PricingSettings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MaterialRate");

            migrationBuilder.DropTable(
                name: "PricingSettings");
        }
    }
}
