using System;
using System.Collections.Generic;

namespace AuctionBackend.Models
{
    public class Auction
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal StartingPrice { get; set; }
        public decimal? CurrentPrice { get; set; }
        public DateTime EndsAt { get; set; }
        public bool IsActive { get; set; } = true;

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public ICollection<Bid> Bids { get; set; } = new List<Bid>();
    }
}
