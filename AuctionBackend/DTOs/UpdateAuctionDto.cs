using System;

namespace AuctionBackend.DTOs
{
    public class UpdateAuctionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal StartingPrice { get; set; }
        public DateTime EndsAt { get; set; }
        public bool IsActive { get; set; }
    }
}
