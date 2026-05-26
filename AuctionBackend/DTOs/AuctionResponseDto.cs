using System;

namespace AuctionBackend.DTOs
{
    public class AuctionResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal StartingPrice { get; set; }
        public decimal? CurrentPrice { get; set; }
        public int? CurrentHighestBidUserId { get; set; }
        public DateTime StartsAt { get; set; }
        public DateTime EndsAt { get; set; }
        public bool IsActive { get; set; }
        public int UserId { get; set; }
    }
}
