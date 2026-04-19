import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { ApiClient, UpstreamError } from "./api-client.js";
import {
  audienceSellingPropertyInputSchema,
  audienceSellingPropertyDescription,
  makeAudienceSellingPropertyHandler,
} from "./tools/audience-selling-property.js";
import {
  audienceLettingPropertyInputSchema,
  audienceLettingPropertyDescription,
  makeAudienceLettingPropertyHandler,
} from "./tools/audience-letting-property.js";
import {
  audienceLandlordsInputSchema,
  audienceLandlordsDescription,
  makeAudienceLandlordsHandler,
} from "./tools/audience-landlords.js";
import {
  addressLookupInputSchema,
  addressLookupDescription,
  makeAddressLookupHandler,
} from "./tools/address-lookup.js";
import {
  streetLookupInputSchema,
  streetLookupDescription,
  makeStreetLookupHandler,
} from "./tools/street-lookup.js";
import {
  getPlaceInputSchema,
  getPlaceDescription,
  makeGetPlaceHandler,
} from "./tools/get-place.js";
import {
  getNearbySchoolInputSchema,
  getNearbySchoolDescription,
  makeGetNearbySchoolHandler,
} from "./tools/get-nearby-school.js";
import {
  getBrandboardInputSchema,
  getBrandboardDescription,
  makeGetBrandboardHandler,
} from "./tools/get-brandboard.js";
import {
  getPropertyInputSchema,
  getPropertyDescription,
  makeGetPropertyHandler,
} from "./tools/get-property.js";
import {
  getEpcFabricByPropertyIdInputSchema,
  getEpcFabricByPropertyIdDescription,
  makeGetEpcFabricByPropertyIdHandler,
} from "./tools/get-epc-fabric-by-property-id.js";
import {
  getEpcFabricByPostcodeInputSchema,
  getEpcFabricByPostcodeDescription,
  makeGetEpcFabricByPostcodeHandler,
} from "./tools/get-epc-fabric-by-postcode.js";
import {
  getPropertiesV2InputSchema,
  getPropertiesV2Description,
  makeGetPropertiesV2Handler,
} from "./tools/get-properties-v2.js";
import {
  getAnalysisDataInputSchema,
  getAnalysisDataDescription,
  makeGetAnalysisDataHandler,
} from "./tools/get-analysis-data.js";
import {
  getQuarterlyMarketAnalysisInputSchema,
  getQuarterlyMarketAnalysisDescription,
  makeGetQuarterlyMarketAnalysisHandler,
} from "./tools/get-quarterly-market-analysis.js";
import {
  getMonthlyMarketAnalysisInputSchema,
  getMonthlyMarketAnalysisDescription,
  makeGetMonthlyMarketAnalysisHandler,
} from "./tools/get-monthly-market-analysis.js";
import {
  getDistributionGraphDataInputSchema,
  getDistributionGraphDataDescription,
  makeGetDistributionGraphDataHandler,
} from "./tools/get-distribution-graph-data.js";
import {
  getHpiInputSchema,
  getHpiDescription,
  makeGetHpiHandler,
} from "./tools/get-hpi.js";
import {
  getSoldPropertiesInputSchema,
  getSoldPropertiesDescription,
  makeGetSoldPropertiesHandler,
} from "./tools/get-sold-properties.js";
import {
  getPropertyHistoryInputSchema,
  getPropertyHistoryDescription,
  makeGetPropertyHistoryHandler,
} from "./tools/get-property-history.js";
import {
  getLeaseholdsInputSchema,
  getLeaseholdsDescription,
  makeGetLeaseholdsHandler,
} from "./tools/get-leaseholds.js";
import {
  getAgentInputSchema,
  getAgentDescription,
  makeGetAgentHandler,
} from "./tools/get-agent.js";
import {
  getComparableInputSchema,
  getComparableDescription,
  makeGetComparableHandler,
} from "./tools/get-comparable.js";
import {
  getComparableByPropertyIdInputSchema,
  getComparableByPropertyIdDescription,
  makeGetComparableByPropertyIdHandler,
} from "./tools/get-comparable-by-property-id.js";
import {
  getValuationByPropertyIdInputSchema,
  getValuationByPropertyIdDescription,
  makeGetValuationByPropertyIdHandler,
} from "./tools/get-valuation-by-property-id.js";
import {
  searchInputSchema,
  searchDescription,
  makeSearchHandler,
} from "./tools/search.js";
import {
  fetchInputSchema,
  fetchDescription,
  makeFetchHandler,
} from "./tools/fetch.js";
import {
  registerComparableCardWidget,
  COMPARABLE_CARD_URI,
} from "./widgets/comparable-card.js";

const READ_ONLY_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

type AnyToolHandler = (input: any) => Promise<unknown>;

function safeHandler(name: string, handler: AnyToolHandler): AnyToolHandler {
  return async (input: unknown) => {
    try {
      return await handler(input);
    } catch (err) {
      console.error(`[tool:${name}] failed`, err);
      const userMessage =
        err instanceof UpstreamError
          ? "Upstream service returned an error. Please try again or refine your query."
          : err instanceof Error && /^Invalid /.test(err.message)
            ? err.message
            : "Tool execution failed.";
      return {
        content: [{ type: "text" as const, text: userMessage }],
        isError: true,
      };
    }
  };
}

interface ToolConfig {
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  _meta?: Record<string, unknown>;
}

function registerReadOnlyTool(
  server: McpServer,
  name: string,
  config: ToolConfig,
  handler: AnyToolHandler,
) {
  const registrationConfig: Record<string, unknown> = {
    title: config.title,
    description: config.description,
    inputSchema: config.inputSchema,
    annotations: { ...READ_ONLY_ANNOTATIONS, title: config.title },
  };
  if (config._meta) registrationConfig._meta = config._meta;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (server.registerTool as any)(name, registrationConfig, safeHandler(name, handler));
}

export function createMcpServer(api: ApiClient): McpServer {
  const server = new McpServer(
    { name: "gpt-mcp", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } },
  );

  registerComparableCardWidget(server);

  registerReadOnlyTool(
    server,
    "search",
    {
      title: "Search",
      description: searchDescription,
      inputSchema: searchInputSchema,
    },
    makeSearchHandler(api),
  );

  registerReadOnlyTool(
    server,
    "fetch",
    {
      title: "Fetch",
      description: fetchDescription,
      inputSchema: fetchInputSchema,
    },
    makeFetchHandler(api),
  );

  registerReadOnlyTool(
    server,
    "audience_selling_property",
    {
      title: "Audience Selling Property",
      description: audienceSellingPropertyDescription,
      inputSchema: audienceSellingPropertyInputSchema,
    },
    makeAudienceSellingPropertyHandler(api),
  );

  registerReadOnlyTool(
    server,
    "audience_letting_property",
    {
      title: "Audience Letting Property",
      description: audienceLettingPropertyDescription,
      inputSchema: audienceLettingPropertyInputSchema,
    },
    makeAudienceLettingPropertyHandler(api),
  );

  registerReadOnlyTool(
    server,
    "audience_landlords",
    {
      title: "Audience Landlords",
      description: audienceLandlordsDescription,
      inputSchema: audienceLandlordsInputSchema,
    },
    makeAudienceLandlordsHandler(api),
  );

  registerReadOnlyTool(
    server,
    "address_lookup",
    {
      title: "Address Lookup",
      description: addressLookupDescription,
      inputSchema: addressLookupInputSchema,
    },
    makeAddressLookupHandler(api),
  );

  registerReadOnlyTool(
    server,
    "street_lookup",
    {
      title: "Street Lookup",
      description: streetLookupDescription,
      inputSchema: streetLookupInputSchema,
    },
    makeStreetLookupHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_place",
    {
      title: "Get Place Data",
      description: getPlaceDescription,
      inputSchema: getPlaceInputSchema,
    },
    makeGetPlaceHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_nearby_school",
    {
      title: "Get Nearby Schools",
      description: getNearbySchoolDescription,
      inputSchema: getNearbySchoolInputSchema,
    },
    makeGetNearbySchoolHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_brandboard",
    {
      title: "Get Broadband Data",
      description: getBrandboardDescription,
      inputSchema: getBrandboardInputSchema,
    },
    makeGetBrandboardHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_property",
    {
      title: "Get Property Detail",
      description: getPropertyDescription,
      inputSchema: getPropertyInputSchema,
    },
    makeGetPropertyHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_epc_fabric_by_property_id",
    {
      title: "Get EPC Fabric By Property ID",
      description: getEpcFabricByPropertyIdDescription,
      inputSchema: getEpcFabricByPropertyIdInputSchema,
    },
    makeGetEpcFabricByPropertyIdHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_epc_fabric_by_postcode",
    {
      title: "Get EPC Fabric By Postcode",
      description: getEpcFabricByPostcodeDescription,
      inputSchema: getEpcFabricByPostcodeInputSchema,
    },
    makeGetEpcFabricByPostcodeHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_properties_v2",
    {
      title: "Get Properties V2",
      description: getPropertiesV2Description,
      inputSchema: getPropertiesV2InputSchema,
    },
    makeGetPropertiesV2Handler(api),
  );

  registerReadOnlyTool(
    server,
    "get_analysis_data",
    {
      title: "Get Regional Analysis",
      description: getAnalysisDataDescription,
      inputSchema: getAnalysisDataInputSchema,
    },
    makeGetAnalysisDataHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_quarterly_market_analysis",
    {
      title: "Get Quarterly Market Analysis",
      description: getQuarterlyMarketAnalysisDescription,
      inputSchema: getQuarterlyMarketAnalysisInputSchema,
    },
    makeGetQuarterlyMarketAnalysisHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_monthly_market_analysis",
    {
      title: "Get Monthly Market Analysis",
      description: getMonthlyMarketAnalysisDescription,
      inputSchema: getMonthlyMarketAnalysisInputSchema,
    },
    makeGetMonthlyMarketAnalysisHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_distribution_graph_data",
    {
      title: "Get Price Distribution",
      description: getDistributionGraphDataDescription,
      inputSchema: getDistributionGraphDataInputSchema,
    },
    makeGetDistributionGraphDataHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_hpi",
    {
      title: "Get House Price Index",
      description: getHpiDescription,
      inputSchema: getHpiInputSchema,
    },
    makeGetHpiHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_sold_properties",
    {
      title: "Get Sold Properties",
      description: getSoldPropertiesDescription,
      inputSchema: getSoldPropertiesInputSchema,
    },
    makeGetSoldPropertiesHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_property_history",
    {
      title: "Get Property History",
      description: getPropertyHistoryDescription,
      inputSchema: getPropertyHistoryInputSchema,
    },
    makeGetPropertyHistoryHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_leaseholds",
    {
      title: "Get Leaseholds",
      description: getLeaseholdsDescription,
      inputSchema: getLeaseholdsInputSchema,
    },
    makeGetLeaseholdsHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_agent",
    {
      title: "Get Agent",
      description: getAgentDescription,
      inputSchema: getAgentInputSchema,
    },
    makeGetAgentHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_comparable",
    {
      title: "Get Comparable Properties",
      description: getComparableDescription,
      inputSchema: getComparableInputSchema,
    },
    makeGetComparableHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_comparable_by_property_id",
    {
      title: "Get Comparable Properties By Property ID",
      description: getComparableByPropertyIdDescription,
      inputSchema: getComparableByPropertyIdInputSchema,
      _meta: {
        "openai/outputTemplate": COMPARABLE_CARD_URI,
        "openai/toolInvocation/invoking": "Finding comparable properties…",
        "openai/toolInvocation/invoked": "Found comparable properties.",
      },
    },
    makeGetComparableByPropertyIdHandler(api),
  );

  registerReadOnlyTool(
    server,
    "get_valuation_by_property_id",
    {
      title: "Get Valuation By Property ID",
      description: getValuationByPropertyIdDescription,
      inputSchema: getValuationByPropertyIdInputSchema,
    },
    makeGetValuationByPropertyIdHandler(api),
  );

  return server;
}
