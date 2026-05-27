using System.Collections.Generic;
using System.Threading.Tasks;
using AuctionBackend.DTOs;
using AuctionBackend.Services;

namespace AuctionBackend.Interfaces
{
    public interface IAdminService
    {
        Task<IEnumerable<AdminUserDto>> GetUsersAsync();
        Task<OperationResult<bool>> DeactivateUserAsync(int id);
        Task<OperationResult<bool>> ActivateUserAsync(int id);
        Task<IEnumerable<AdminAuctionDto>> GetAuctionsAsync();
        Task<OperationResult<bool>> DeactivateAuctionAsync(int id);
        Task<OperationResult<bool>> ActivateAuctionAsync(int id);
    }
}
