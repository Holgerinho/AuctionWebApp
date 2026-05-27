using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AuctionBackend.DTOs;
using AuctionBackend.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuctionBackend.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<AdminUserDto>>> GetUsers()
        {
            var users = await _adminService.GetUsersAsync();
            return Ok(users);
        }

        [HttpPut("users/{id:int}/deactivate")]
        public async Task<IActionResult> DeactivateUser(int id)
        {
            var result = await _adminService.DeactivateUserAsync(id);
            if (result.IsSuccess)
            {
                return NoContent();
            }

            return result.StatusCode switch
            {
                400 => BadRequest(result.Error),
                404 => NotFound(result.Error),
                _ => StatusCode(result.StatusCode, result.Error)
            };
        }

        [HttpPut("users/{id:int}/activate")]
        public async Task<IActionResult> ActivateUser(int id)
        {
            var result = await _adminService.ActivateUserAsync(id);
            if (result.IsSuccess)
            {
                return NoContent();
            }

            return result.StatusCode == 404
                ? NotFound(result.Error)
                : StatusCode(result.StatusCode, result.Error);
        }

        [HttpGet("auctions")]
        public async Task<ActionResult<IEnumerable<AdminAuctionDto>>> GetAuctions()
        {
            var auctions = await _adminService.GetAuctionsAsync();
            return Ok(auctions);
        }

        [HttpPut("auctions/{id:int}/deactivate")]
        public async Task<IActionResult> DeactivateAuction(int id)
        {
            var result = await _adminService.DeactivateAuctionAsync(id);
            if (result.IsSuccess)
            {
                return NoContent();
            }

            return result.StatusCode == 404
                ? NotFound(result.Error)
                : StatusCode(result.StatusCode, result.Error);
        }

        [HttpPut("auctions/{id:int}/activate")]
        public async Task<IActionResult> ActivateAuction(int id)
        {
            var result = await _adminService.ActivateAuctionAsync(id);
            if (result.IsSuccess)
            {
                return NoContent();
            }

            return result.StatusCode == 404
                ? NotFound(result.Error)
                : StatusCode(result.StatusCode, result.Error);
        }
    }
}
