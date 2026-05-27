using System.Collections.Generic;
using System.Threading.Tasks;
using AuctionBackend.DTOs;
using AuctionBackend.Services;

namespace AuctionBackend.Interfaces
{
    public interface IAuctionService
    {
        Task<IEnumerable<AuctionResponseDto>> GetOpenAuctionsAsync();
        Task<IEnumerable<AuctionResponseDto>> SearchOpenAuctionsAsync(string title);
        Task<IEnumerable<AuctionResponseDto>> GetClosedAuctionsAsync(string? title);
        Task<IEnumerable<AuctionResponseDto>> GetMyAuctionsAsync(int userId);
        Task<IEnumerable<AuctionResponseDto>> GetAuctionsIBidOnAsync(int userId);
        Task<AuctionResponseDto?> GetByIdAsync(int id);
        Task<OperationResult<AuctionResponseDto>> CreateAsync(CreateAuctionDto dto, int userId);
        Task<OperationResult<AuctionResponseDto>> UpdateAsync(int id, UpdateAuctionDto dto, int userId);
        Task<OperationResult<IEnumerable<BidResponseDto>>> GetBidsAsync(int auctionId);
        Task<OperationResult<BidResponseDto>> CreateBidAsync(int auctionId, CreateBidDto dto, int userId);
    }
}
