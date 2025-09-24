(function (global) {
  const DEFAULT_ASSETS = {
    teamLogo: "../Image/team.png",
    casterPhoto: "../Image/caster.png",
    tournamentLogo: "../Image/logo.png",
  };

  const safeConfig = () => global.__RAYNU_CONFIG__ || {};

  const ensureFunction = (maybeFn, fallback) =>
    typeof maybeFn === "function" ? maybeFn : fallback;

  const normalizePath = (path, { allowEmpty = false } = {}) => {
    if (!path) return allowEmpty ? "" : "/";
    return path.startsWith("/") ? path : `/${path}`;
  };

  const fallbackResolver = (assetPath) => assetPath || "";

  const createFallbackAdapter = ({
    fallbackAssets = {},
    fallbackFetch,
    fallbackResolveMediaUrl,
  } = {}) => {
    const config = safeConfig();

    const buildApiUrl = (endpoint = "") => {
      const rawBase =
        (typeof config.apiBaseUrl === "string" && config.apiBaseUrl.trim()) ||
        "https://api.raynucommunitytournament.xyz/api";
      const normalizedBase = rawBase.endsWith("/")
        ? rawBase.slice(0, -1)
        : rawBase;
      if (!endpoint) return normalizedBase;
      const normalizedEndpoint = endpoint.startsWith("/")
        ? endpoint
        : `/${endpoint}`;
      return `${normalizedBase}${normalizedEndpoint}`;
    };

    const defaultFetch = async (endpoint) => {
      const url = buildApiUrl(endpoint);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    };

    const fetcher =
      typeof fallbackFetch === "function"
        ? fallbackFetch
        : typeof config.fetchApiData === "function"
        ? (endpoint) => config.fetchApiData(endpoint)
        : defaultFetch;

    const resolver =
      typeof fallbackResolveMediaUrl === "function"
        ? fallbackResolveMediaUrl
        : typeof config.resolveMediaUrl === "function"
        ? (assetPath) => config.resolveMediaUrl(assetPath)
        : fallbackResolver;

    const getDefaultAsset = (key) => {
      if (fallbackAssets[key]) return fallbackAssets[key];
      if (
        config.defaultAssets &&
        typeof config.defaultAssets === "object" &&
        config.defaultAssets[key]
      ) {
        return config.defaultAssets[key];
      }
      return DEFAULT_ASSETS[key] || "";
    };

    return {
      fetchApiData: fetcher,
      resolveMediaUrl: resolver,
      getDefaultAsset,
      withDefault(assetPath, key) {
        const resolved = assetPath ? resolver(assetPath) : "";
        return resolved || getDefaultAsset(key);
      },
      buildApiUrl,
      get defaults() {
        const configDefaults =
          config.defaultAssets && typeof config.defaultAssets === "object"
            ? config.defaultAssets
            : {};
        return { ...DEFAULT_ASSETS, ...configDefaults, ...fallbackAssets };
      },
      getApiBaseUrl() {
        return buildApiUrl("");
      },
      getConfig: () => config,
    };
  };

  const fallbackFetch = async (endpoint) => {
    const config = safeConfig();

    const attempts = [];
    const apiBaseUrl =
      typeof config.apiBaseUrl === "string" && config.apiBaseUrl.trim();
    const staticBaseUrl =
      typeof config.staticFallbackBaseUrl === "string" &&
      config.staticFallbackBaseUrl.trim();

    if (apiBaseUrl) {
      const base = apiBaseUrl.endsWith("/")
        ? apiBaseUrl.slice(0, -1)
        : apiBaseUrl;
      attempts.push({
        url: `${base}${normalizePath(endpoint)}`,
        source: "remote",
      });
    }

    if (staticBaseUrl) {
      const base = staticBaseUrl.endsWith("/")
        ? staticBaseUrl.slice(0, -1)
        : staticBaseUrl;
      const fileEndpoint = normalizePath(endpoint, { allowEmpty: true })
        .replace(/^\//, "")
        .replace(/\.json$/i, "");
      attempts.push({
        url: `${base}/${fileEndpoint}.json`,
        source: "static",
      });
    }

    if (attempts.length === 0) {
      attempts.push({ url: endpoint, source: "direct" });
    }

    let lastError = null;
    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (config) {
          config.__lastSuccessfulSource = attempt.source;
        }
        return data;
      } catch (error) {
        lastError = error;
        console.warn(
          `[RaynuClient] Falló la solicitud a ${attempt.url}:`,
          error
        );
      }
    }

    throw lastError || new Error("No se pudo obtener información del API.");
  };

  const getConfigDefaultAsset = (key) => {
    const config = safeConfig();
    const fromConfig =
      config.defaultAssets && typeof config.defaultAssets === "object"
        ? config.defaultAssets[key]
        : undefined;
    return fromConfig || DEFAULT_ASSETS[key] || "";
  };

  const resolveMediaUrl = (assetPath) =>
    ensureFunction(safeConfig().resolveMediaUrl, fallbackResolver)(assetPath);

  const getDefaultAsset = (key) => getConfigDefaultAsset(key);

  const withDefault = (assetPath, key) => {
    const resolved = assetPath ? resolveMediaUrl(assetPath) : "";
    const fallback = getDefaultAsset(key);
    return resolved || fallback;
  };

  const getApiBaseUrl = () => {
    const config = safeConfig();
    const rawBase =
      typeof config.apiBaseUrl === "string" && config.apiBaseUrl.trim();
    return rawBase || "https://api.raynucommunitytournament.xyz/api";
  };

  const buildApiUrl = (endpoint = "") => {
    const base = getApiBaseUrl();
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    if (!endpoint) return normalizedBase;
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    return `${normalizedBase}${normalizedEndpoint}`;
  };

  const RaynuClient = {
    getConfig: () => safeConfig(),
    fetchApiData: (endpoint) =>
      ensureFunction(safeConfig().fetchApiData, fallbackFetch)(endpoint),
    resolveMediaUrl,
    getDefaultAsset,
    withDefault,
    buildApiUrl,
    getApiBaseUrl,
    get defaults() {
      const config = safeConfig();
      const configuredDefaults =
        config.defaultAssets && typeof config.defaultAssets === "object"
          ? config.defaultAssets
          : {};
      return { ...DEFAULT_ASSETS, ...configuredDefaults };
    },
  };

  RaynuClient.createAdapter = function createAdapter(options = {}) {
    const fallbackAdapter = createFallbackAdapter(options);
    const client = this;

    return {
      fetchApiData: ensureFunction(
        client.fetchApiData,
        fallbackAdapter.fetchApiData
      ),
      resolveMediaUrl: ensureFunction(
        client.resolveMediaUrl,
        fallbackAdapter.resolveMediaUrl
      ),
      getDefaultAsset(key) {
        const fromClient =
          typeof client.getDefaultAsset === "function"
            ? client.getDefaultAsset(key)
            : undefined;
        return fromClient || fallbackAdapter.getDefaultAsset(key);
      },
      withDefault(assetPath, key) {
        if (typeof client.withDefault === "function") {
          const result = client.withDefault(assetPath, key);
          if (result) return result;
        }
        return fallbackAdapter.withDefault(assetPath, key);
      },
      buildApiUrl(endpoint = "") {
        if (typeof client.buildApiUrl === "function") {
          return client.buildApiUrl(endpoint);
        }
        return fallbackAdapter.buildApiUrl(endpoint);
      },
      get defaults() {
        return { ...fallbackAdapter.defaults, ...(client.defaults || {}) };
      },
      getApiBaseUrl() {
        if (typeof client.getApiBaseUrl === "function") {
          return client.getApiBaseUrl();
        }
        return fallbackAdapter.getApiBaseUrl();
      },
      getConfig() {
        if (typeof client.getConfig === "function") {
          return client.getConfig();
        }
        return fallbackAdapter.getConfig();
      },
      get client() {
        return client;
      },
      get fallback() {
        return fallbackAdapter;
      },
    };
  };

  global.RaynuClient = RaynuClient;
  global.getRaynuAdapter = function getRaynuAdapter(options = {}) {
    if (
      global.RaynuClient &&
      typeof global.RaynuClient.createAdapter === "function"
    ) {
      return global.RaynuClient.createAdapter(options);
    }
    return createFallbackAdapter(options);
  };
})(window);
