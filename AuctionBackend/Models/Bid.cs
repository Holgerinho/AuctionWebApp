using System;

namespace AuctionBackend.Models
{
    public class Bid
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int AuctionId { get; set; }
        public Auction Auction { get; set; } = null!;
    }
}
