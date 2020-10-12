import { ClusterStack } from "../lib/cluster-stack";
import * as cdk from "@aws-cdk/core";
import { CdkPipeline, SimpleSynthAction, ShellScriptAction } from "@aws-cdk/pipelines";
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
  public readonly clusterEndpoint: cdk.CfnOutput;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const cluster = new ClusterStack(this, "Cluster");
    this.clusterEndpoint = cluster.clusterEndpoint;
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
     const dev = new ClusterApp(scope, "Dev", {
        env: {
          account: "223476298486",
          region: "ap-southeast-2",
        },
      });
    const devStage = pipeline.addApplicationStage(dev)

    devStage.addActions(new ShellScriptAction({
      actionName: 'TestService',
      useOutputs: {
        // Get the stack Output from the Stage and make it available in
        // the shell script as $ENDPOINT_URL.
        ENDPOINT_URL: pipeline.stackOutput(dev.clusterEndpoint),
      },
      commands: [
        // Use 'curl' to GET the given URL and fail if it returns an error
        'curl -Ssf $ENDPOINT_URL',
      ],
    }));
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
