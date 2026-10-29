using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintWithZwe.Api.Migrations
{
    /// <inheritdoc />
    public partial class SiteSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SiteSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BrandName = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    BrandTagline = table.Column<string>(type: "TEXT", maxLength: 180, nullable: false),
                    HeroBadge = table.Column<string>(type: "TEXT", maxLength: 140, nullable: false),
                    HeroBadgeShort = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    PhoneNumber = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    TelegramUsername = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    WhatsappNumber = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    MessengerPageId = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SiteSettings");
        }
    }
}
