import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ApiClient } from "./api-client.js";
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
  registerComparableCardWidget,
  COMPARABLE_CARD_URI,
} from "./widgets/comparable-card.js";

export function createMcpServer(api: ApiClient): McpServer {
  const server = new McpServer(
    { name: "gpt-mcp", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } },
  );

  registerComparableCardWidget(server);

  server.registerTool(
    "audience_selling_property",
    {
      title: "Audience Selling Property",
      description: audienceSellingPropertyDescription,
      inputSchema: audienceSellingPropertyInputSchema,
    },
    makeAudienceSellingPropertyHandler(api),
  );

  server.registerTool(
    "audience_letting_property",
    {
      title: "Audience Letting Property",
      description: audienceLettingPropertyDescription,
      inputSchema: audienceLettingPropertyInputSchema,
    },
    makeAudienceLettingPropertyHandler(api),
  );

  server.registerTool(
    "audience_landlords",
    {
      title: "Audience Landlords",
      description: audienceLandlordsDescription,
      inputSchema: audienceLandlordsInputSchema,
    },
    makeAudienceLandlordsHandler(api),
  );

  server.registerTool(
    "address_lookup",
    {
      title: "Address Lookup",
      description: addressLookupDescription,
      inputSchema: addressLookupInputSchema,
    },
    makeAddressLookupHandler(api),
  );

  server.registerTool(
    "street_lookup",
    {
      title: "Street Lookup",
      description: streetLookupDescription,
      inputSchema: streetLookupInputSchema,
    },
    makeStreetLookupHandler(api),
  );

  server.registerTool(
    "get_place",
    {
      title: "Get Place Data",
      description: getPlaceDescription,
      inputSchema: getPlaceInputSchema,
    },
    makeGetPlaceHandler(api),
  );

  server.registerTool(
    "get_nearby_school",
    {
      title: "Get Nearby Schools",
      description: getNearbySchoolDescription,
      inputSchema: getNearbySchoolInputSchema,
    },
    makeGetNearbySchoolHandler(api),
  );

  server.registerTool(
    "get_brandboard",
    {
      title: "Get Broadband Data",
      description: getBrandboardDescription,
      inputSchema: getBrandboardInputSchema,
    },
    makeGetBrandboardHandler(api),
  );

  server.registerTool(
    "get_property",
    {
      title: "Get Property Detail",
      description: getPropertyDescription,
      inputSchema: getPropertyInputSchema,
    },
    makeGetPropertyHandler(api),
  );

  server.registerTool(
    "get_epc_fabric_by_property_id",
    {
      title: "Get EPC Fabric By Property ID",
      description: getEpcFabricByPropertyIdDescription,
      inputSchema: getEpcFabricByPropertyIdInputSchema,
    },
    makeGetEpcFabricByPropertyIdHandler(api),
  );

  server.registerTool(
    "get_epc_fabric_by_postcode",
    {
      title: "Get EPC Fabric By Postcode",
      description: getEpcFabricByPostcodeDescription,
      inputSchema: getEpcFabricByPostcodeInputSchema,
    },
    makeGetEpcFabricByPostcodeHandler(api),
  );

  server.registerTool(
    "get_properties_v2",
    {
      title: "Get Properties V2",
      description: getPropertiesV2Description,
      inputSchema: getPropertiesV2InputSchema,
    },
    makeGetPropertiesV2Handler(api),
  );

  server.registerTool(
    "get_analysis_data",
    {
      title: "Get Regional Analysis",
      description: getAnalysisDataDescription,
      inputSchema: getAnalysisDataInputSchema,
    },
    makeGetAnalysisDataHandler(api),
  );

  server.registerTool(
    "get_quarterly_market_analysis",
    {
      title: "Get Quarterly Market Analysis",
      description: getQuarterlyMarketAnalysisDescription,
      inputSchema: getQuarterlyMarketAnalysisInputSchema,
    },
    makeGetQuarterlyMarketAnalysisHandler(api),
  );

  server.registerTool(
    "get_monthly_market_analysis",
    {
      title: "Get Monthly Market Analysis",
      description: getMonthlyMarketAnalysisDescription,
      inputSchema: getMonthlyMarketAnalysisInputSchema,
    },
    makeGetMonthlyMarketAnalysisHandler(api),
  );

  server.registerTool(
    "get_distribution_graph_data",
    {
      title: "Get Price Distribution",
      description: getDistributionGraphDataDescription,
      inputSchema: getDistributionGraphDataInputSchema,
    },
    makeGetDistributionGraphDataHandler(api),
  );

  server.registerTool(
    "get_hpi",
    {
      title: "Get House Price Index",
      description: getHpiDescription,
      inputSchema: getHpiInputSchema,
    },
    makeGetHpiHandler(api),
  );

  server.registerTool(
    "get_sold_properties",
    {
      title: "Get Sold Properties",
      description: getSoldPropertiesDescription,
      inputSchema: getSoldPropertiesInputSchema,
    },
    makeGetSoldPropertiesHandler(api),
  );

  server.registerTool(
    "get_property_history",
    {
      title: "Get Property History",
      description: getPropertyHistoryDescription,
      inputSchema: getPropertyHistoryInputSchema,
    },
    makeGetPropertyHistoryHandler(api),
  );

  server.registerTool(
    "get_leaseholds",
    {
      title: "Get Leaseholds",
      description: getLeaseholdsDescription,
      inputSchema: getLeaseholdsInputSchema,
    },
    makeGetLeaseholdsHandler(api),
  );

  server.registerTool(
    "get_agent",
    {
      title: "Get Agent",
      description: getAgentDescription,
      inputSchema: getAgentInputSchema,
    },
    makeGetAgentHandler(api),
  );

  server.registerTool(
    "get_comparable",
    {
      title: "Get Comparable Properties",
      description: getComparableDescription,
      inputSchema: getComparableInputSchema,
    },
    makeGetComparableHandler(api),
  );

  server.registerTool(
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

  server.registerTool(
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
