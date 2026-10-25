const createLinkSchema = {
  body: {
    type: "object",
    required: ["longUrl"],
    properties: {
      longUrl: { type: "string" },
      alias: { type: "string" },
      expiresAt: { type: "string" },
    },
  },
};

export function registerLinkRoutes(app, { createLink, resolveLink, baseUrl }) {
  app.post("/api/v1/links", { schema: createLinkSchema }, async (request, reply) => {
    const { longUrl, alias, expiresAt } = request.body;

    const link = await createLink({
      longUrl,
      alias,
      expiresAt: expiresAt === undefined ? undefined : new Date(expiresAt),
    });

    return reply.status(201).send({
      code: link.code,
      shortUrl: `${baseUrl}/${link.code}`,
      longUrl: link.longUrl,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    });
  });

  app.get("/:code", async (request, reply) => {
    const link = await resolveLink(request.params.code);
    return reply.redirect(link.longUrl);
  });
}