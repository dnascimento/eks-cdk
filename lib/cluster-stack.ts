import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as eks from "@aws-cdk/aws-eks";
import * as yaml from "js-yaml";
import * as fs from "fs";

interface ClusterStackProps extends StackProps {
  stage: string;
}

export class ClusterStack extends Stack {
  public readonly clusterEndpoint: CfnOutput;
  constructor(scope: Construct, id: string, props: ClusterStackProps) {
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
        { namespace: "argocd" },
      ],
    });

    // const argocdManifest = yaml.safeLoadAll(
    //   fs.readFileSync("./k8s-manifests/argocd.yaml", "utf8")
    // );
    // cluster.addManifest("argocd", ...argocdManifest);
    // const appsManifest = yaml.safeLoadAll(
    //   fs.readFileSync("./k8s-manifests/apps.yaml", "utf8")
    // );
    // appsManifest[1].spec.source.helm.parameters[0].value = props.stage;
    // cluster.addManifest("apps", ...appsManifest);

    this.clusterEndpoint = new CfnOutput(this, "Url", {
      value: cluster.clusterEndpoint,
    });
  }
}
