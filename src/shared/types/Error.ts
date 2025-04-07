export class DatabaseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class DataNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataNotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class IpAddressNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IpAddressNotFoundError";
  }
}

export class PasswordDoesNotMatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordDoesNotMatchError";
  }
}
