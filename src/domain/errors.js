export class InvalidUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidUrlError";
    this.code = "INVALID_URL";
  }
}

export class InvalidAliasError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidAliasError";
    this.code = "INVALID_ALIAS";
  }
}

export class InvalidExpiryError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidExpiryError";
    this.code = "INVALID_EXPIRY";
  }
}

export class CodeAlreadyExistsError extends Error {
  constructor(shortCode) {
    super(`Code '${shortCode}' already exists.`);
    this.name = "CodeAlreadyExistsError";
    this.code = "CODE_ALREADY_EXISTS";
  }
}


export class AliasTakenError extends Error {
  constructor(alias) {
    super(`The alias '${alias}' is already in use.`);
    this.name = "AliasTakenError";
    this.code = "ALIAS_TAKEN";
  }
}

export class CodeGenerationError extends Error {
  constructor() {
    super("Could not generate a unique code. Please try again.");
    this.name = "CodeGenerationError";
    this.code = "CODE_GENERATION_FAILED";
  }
}


export class LinkNotFoundError extends Error {
  constructor(shortCode) {
    super(`Link '${shortCode}' was not found.`);
    this.name = "LinkNotFoundError";
    this.code = "LINK_NOT_FOUND";
  }
}

export class LinkGoneError extends Error {
  constructor(shortCode, reason) {
    super(`Link '${shortCode}' is ${reason}.`);
    this.name = "LinkGoneError";
    this.code = "LINK_GONE";
    this.reason = reason;
  }
}