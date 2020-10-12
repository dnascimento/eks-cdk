import { ClusterStack } from "../lib/cluster-stack";
import * as cdk from "@aws-cdk/core";
import { CdkPipeline, SimpleSynthAction } from "@aws-cdk/pipelines";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";

/**
 * Your application
 *
 * May consist of one or more Stacks (here, two)
 *
 * By declaring our DatabaseStack and our ComputeStack inside a Stage,
 * we make sure they are deployed together, or not at all.
 */
class ClusterApp extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const cluster = new ClusterStack(this, "Cluster");
  }
}

/**
 * Stack to hold the pipeline
 */
export class ClusterPipeline extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const cloudAssemblyArtifact = new codepipeline.Artifact();
    const oauthSecretArn = "dnascimento-github-token"
    const oauth = cdk.SecretValue.secretsManager(oauthSecretArn);

    const pipeline = new CdkPipeline(this, "Pipeline", {
      // The pipeline name
      pipelineName: "ClusterManagementPipeline",
      cloudAssemblyArtifact,

      // Where the source can be found
      sourceAction: new codepipeline_actions.GitHubSourceAction({
        actionName: "GitHub",
        output: sourceArtifact,
        oauthToken: oauth,
        owner: "dnascimento",
        repo: "eks-cdk",
      }),

      // How it will be built and synthesized
      synthAction: SimpleSynthAction.standardNpmSynth({
        sourceArtifact,
        cloudAssemblyArtifact,

        // We need a build step to compile the TypeScript Lambda
        buildCommand: "npm run build",
      }),
    });

    // Do this as many times as necessary with any account and region
    // Account and region may different from the pipeline's.
    pipeline.addApplicationStage(
      new ClusterApp(scope, "Mgmt", {
        env: {
          account: "223476298486",
          region: "ap-southeast-2",
        },
      })
    );
    pipeline.addApplicationStage(
      new ClusterApp(scope, "Non-Prod", {
        env: {
          account: "511321940675",
          region: "ap-southeast-2",
        },
      })
    );

  }
}
