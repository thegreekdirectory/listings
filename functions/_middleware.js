export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Define your required parameter and value
  const SECRET_PARAM = "access";
  const SECRET_VALUE = "granted";

  if (url.searchParams.get(SECRET_PARAM) !== SECRET_VALUE) {
    return new Response("Forbidden: Missing or invalid query parameter.", {
      status: 403,
    });
  }

  // If the parameter is correct, let the request proceed to the site
  return next();
}