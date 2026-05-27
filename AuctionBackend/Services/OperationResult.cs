namespace AuctionBackend.Services
{
    public class OperationResult<T>
    {
        public bool IsSuccess { get; init; }
        public int StatusCode { get; init; }
        public string? Error { get; init; }
        public T? Data { get; init; }

        public static OperationResult<T> Success(T data, int statusCode = 200) => new()
        {
            IsSuccess = true,
            StatusCode = statusCode,
            Data = data
        };

        public static OperationResult<T> Failure(int statusCode, string? error = null) => new()
        {
            IsSuccess = false,
            StatusCode = statusCode,
            Error = error
        };
    }
}
