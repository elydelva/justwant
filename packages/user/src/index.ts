/**
 * @justwant/user — User entity and identity
 * defineUser, createUserService.
 */

export { defineUser } from "./defineUser.js";
export type { UserDef } from "./defineUser.js";

export { createUserService } from "./createUserService.js";
export type { CreateUserServiceOptions, UsersApi } from "./createUserService.js";

export type { User, UserRef, UsersRepo, CreateInput } from "./types/index.js";

export { UserError, UserNotFoundError, DuplicateEmailError } from "./errors/index.js";
