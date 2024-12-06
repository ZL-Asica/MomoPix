const parseCookies = (cookieString: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  const cookieArray = cookieString.split('; ');
  for (const cookie of cookieArray) {
    const [key, value] = cookie.split('=');
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
};

export default parseCookies;
