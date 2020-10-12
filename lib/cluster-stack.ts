import * as apigw from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core";
import * as path from "path";

export class ClusterStack extends Stack {
  public readonly clusterEndpoint: CfnOutput;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, "batata")

    // The Lambda function that contains the functionality
    // const handler = new lambda.Function(this, "Lambda", {
    //   runtime: lambda.Runtime.NODEJS_12_X,
    //   handler: "handler.handler",
    //   code: lambda.Code.fromAsset(path.resolve(__dirname, "lambda")),
    // });

    // // An API Gateway to make the Lambda web-accessible
    // const gw = new apigw.LambdaRestApi(this, "Gateway", {
    //   description: "Endpoint for a simple Lambda-powered web service",
    //   handler,
    // });

    this.clusterEndpoint = new CfnOutput(this, "Url", {
      value: "https://amazon.com",
    });
  }
}
