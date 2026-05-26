namespace AuctionBackend.Models
{
    public class AuctionImage
    {
        public int Id { get; set; }
        public string Url { get; set; } = string.Empty;

        public int AuctionId { get; set; }
        public Auction Auction { get; set; } = null!;
    }
}
