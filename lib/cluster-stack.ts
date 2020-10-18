import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as eks from "@aws-cdk/aws-eks";
import * as yaml from "js-yaml";
import * as fs from "fs";
import * as path from "path";

const argocdManinfestUrl =
  "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml";

export class ClusterStack extends Stack {
  public readonly clusterEndpoint: CfnOutput;
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      tags: {
        Name: "aws-controltower-VPC",
      },
    });

    const cluster = new eks.Cluster(this, "Eks", {
      clusterName: "eks",
      version: eks.KubernetesVersion.V1_17,
      defaultCapacity: 0,
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
    });
    cluster.addNodegroupCapacity("custom-node-group", {
      instanceType: new ec2.InstanceType("t2.micro"),
      minSize: 3,
      subnets: { subnetType: ec2.SubnetType.PUBLIC },
      diskSize: 100,
    });
    cluster.addFargateProfile("MyProfile", {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE },
      selectors: [
        { namespace: "kube-system" },
        { namespace: "gatekeeper-system" },
      ],
    });
    const namespace = applyManifestFile(
      cluster,
      "./k8s-manifests/argocd-namespace.yaml"
    );
    const argocd = applyManifestFile(cluster, "./k8s-manifests/argocd.yaml");
    argocd.node.addDependency(namespace);
    const apps = applyManifestFile(cluster, "./k8s-manifests/apps.yaml");
    apps.node.addDependency(argocd);
    this.clusterEndpoint = new CfnOutput(this, "Url", {
      value: cluster.clusterEndpoint,
    });
  }
}

function applyManifestFile(cluster: eks.Cluster, filePath: string) {
  const argocdManifest = yaml.safeLoadAll(fs.readFileSync(filePath, "utf8"));
  return cluster.addManifest(path.basename(filePath), ...argocdManifest);
}
