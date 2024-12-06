const hashHelper = async (
  saltHex: string,
  password: string,
  rounds: number = 1000
): Promise<string> => {
  const encoder = new TextEncoder();
  const saltedPassword = encoder.encode(saltHex + password);

  // Hash the salted password with SHA-256 `rounds` times
  let hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);
  for (let i = 1; i < rounds; i++) {
    hashBuffer = await crypto.subtle.digest('SHA-256', hashBuffer);
  }
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
};

const hashPassword = async (
  password: string,
  rounds: number = 1000
): Promise<string> => {
  // Generate a random 16-byte salt (128 bits)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const hashHex = await hashHelper(saltHex, password, rounds);

  return `${saltHex}:${hashHex}:${rounds}`;
};

const verifyPassword = async (
  password: string,
  storedHash: string
): Promise<boolean> => {
  const [saltHex, originalHash, rounds] = storedHash.split(':');

  // Hash the password with the same salt and number of rounds
  const hashHex = await hashHelper(saltHex, password, parseInt(rounds, 10));

  return hashHex === originalHash;
};

export { hashPassword, verifyPassword };
