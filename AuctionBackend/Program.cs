using System.Text;
using AuctionBackend.Data;
using AuctionBackend.Models;
using AuctionBackend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Swashbuckle.AspNetCore.SwaggerGen;
using Swashbuckle.AspNetCore.SwaggerUI;

var builder = WebApplication.CreateBuilder(args);
var corsPolicyName = "AllowFrontend";

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<TokenService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicyName, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["Key"] ?? string.Empty;
var jwtIssuer = jwtSettings["Issuer"] ?? string.Empty;
var jwtAudience = jwtSettings["Audience"] ?? string.Empty;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = new PasswordHasher<User>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    var adminUserName = config["AdminSeed:UserName"] ?? "admin";
    var adminEmail = config["AdminSeed:Email"] ?? "admin@auction.local";
    var adminPassword = config["AdminSeed:Password"] ?? "Admin123!";

    var adminUser = dbContext.Users.FirstOrDefault(u => u.UserName == adminUserName);
    if (adminUser == null)
    {
        adminUser = new User
        {
            UserName = adminUserName,
            Email = adminEmail,
            Role = "Admin",
            IsActive = true
        };
        adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, adminPassword);
        dbContext.Users.Add(adminUser);
    }
    else
    {
        adminUser.Role = "Admin";
        adminUser.IsActive = true;
    }

    dbContext.SaveChanges();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors(corsPolicyName);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.UseSwagger();
app.UseSwaggerUI();

app.Run();
