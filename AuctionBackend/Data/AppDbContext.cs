using AuctionBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace AuctionBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Auction> Auctions { get; set; } = null!;
        public DbSet<AuctionImage> AuctionImages { get; set; } = null!;
        public DbSet<Bid> Bids { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Auction>()
                .Property(a => a.StartingPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Auction>()
                .Property(a => a.CurrentPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Bid>()
                .Property(b => b.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Auction>()
                .HasOne(a => a.User)
                .WithMany(u => u.Auctions)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Bid>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bids)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AuctionImage>()
                .HasOne(i => i.Auction)
                .WithMany(a => a.Images)
                .HasForeignKey(i => i.AuctionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
