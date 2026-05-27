using System.Threading.Tasks;
using AuctionBackend.DTOs;
using AuctionBackend.Services;

namespace AuctionBackend.Interfaces
{
    public interface IAuthService
    {
        Task<OperationResult<string>> RegisterAsync(RegisterDto dto);
        Task<OperationResult<string>> LoginAsync(LoginDto dto);
    }
}
