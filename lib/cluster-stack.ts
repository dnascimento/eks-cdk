import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as eks from "@aws-cdk/aws-eks";
import * as s3 from "@aws-cdk/aws-s3";
import * as yaml from "js-yaml";
import * as fs from "fs";

const argocdManinfestUrl =
  "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml";

export class ClusterStack extends Stack {
  public readonly clusterEndpoint: CfnOutput;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, "batata");
    const cluster = new eks.Cluster(this, "Eks", {
      clusterName: "eks",
      version: eks.KubernetesVersion.V1_17,
      defaultCapacity: 0,
      // endpointAccess: eks.EndpointAccess.PRIVATE // No access outside of your VPC.
    });

    // // cluster.addNodegroupCapacity('custom-node-group', {
    // //   instanceType: new ec2.InstanceType('t2.micro'),
    // //   minSize: 1,
    // //   diskSize: 100,
    // // });
    // cluster.addFargateProfile('MyProfile', {
    //   selectors: [ { namespace: 'default' } ]
    // });

    const argocdManifest = yaml.safeLoadAll(
      fs.readFileSync("./k8s-manifests/argocd.yaml", "utf8")
    );
    // cluster.addManifest("argocd", ...argocdManifest);
    // cluster.addHelmChart('NginxIngress', {
    //   chart: 'nginx-ingress',
    //   repository: 'https://helm.nginx.com/stable',
    //   namespace: 'kube-system'
    // });

    this.clusterEndpoint = new CfnOutput(this, "Url", {
      value: cluster.clusterEndpoint,
    });
  }
}
