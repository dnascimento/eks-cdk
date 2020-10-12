#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ClusterPipeline } from "../lib/pipeline";

const app = new cdk.App();
new ClusterPipeline(app, "ClusterPipeline", {
        env: {
          account: "223476298486",
          region: "ap-southeast-2",
        },
      });
