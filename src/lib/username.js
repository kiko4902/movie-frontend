// Same rule the API and the database enforce; used for the inputs' pattern attribute.
// The dash is escaped because browsers compile the pattern with the `v` flag.
export const USERNAME_PATTERN = '[A-Za-z0-9_.\\-]{3,30}';
