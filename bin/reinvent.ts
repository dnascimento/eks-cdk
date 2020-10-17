#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { ClusterPipeline } from "../lib/pipeline";
import { ClusterStack } from "../lib/cluster-stack";

const app = new cdk.App();
// new ClusterStack(app, "Cluster", {
//   env: {
//     account: "284117703700",
//     region: "ap-southeast-2",
//   },
// });
new ClusterPipeline(app, "ClusterPipeline", {
  env: {
    account: "223476298486",
    region: "ap-southeast-2",
  },
});
