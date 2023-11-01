import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { GithubActionsRole } from './github-actions-role';
import { CfnOutput } from 'aws-cdk-lib';

export interface GithubDeployedEc2AppStackProps extends cdk.StackProps {
    repo: string;
    cdApplicationName: string;
}

export class GithubDeployedEc2AppStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: GithubDeployedEc2AppStackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'VPC');

        /**
         * S3 bucket Github will upload built code to, read by EC2 virtual machine during deployments.
         */
        const deploymentBucket = new s3.Bucket(this, 'deploymentBucket', {
            publicReadAccess: false,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
            autoDeleteObjects: true,
        });

        /**
         * Permissions Github actions will use to upload to S3 and trigger deployments.
         * This allows Github to take actions in your AWS account, only actions from the specified repo are allowed.
         */
        const githubActionsRole = new GithubActionsRole(this, 'GithubActionsRole', {
            repo: props.repo
        });
        deploymentBucket.grantPut(githubActionsRole.role);

        
        /**
         * Following components specify creating an EC2 virtual machine running linux.
         */

        const userData = ec2.UserData.forLinux();
        userData.addCommands(
            'yum update -y',
            'yum install -y amazon-cloudwatch-agent nodejs',
            'npm install pm2 -g'
        );

        const ec2InstanceSecurityGroup = new ec2.SecurityGroup(
            this,
            'ec2InstanceSecurityGroup',
            { vpc: vpc, allowAllOutbound: true },
        );

        const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
            vpc: vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machineImage: ec2.MachineImage.latestAmazonLinux2023(),
            userData: userData,
            securityGroup: ec2InstanceSecurityGroup,
            desiredCapacity: 1,
            ssmSessionPermissions: true,
            updatePolicy: autoscaling.UpdatePolicy.replacingUpdate(),
        });
        deploymentBucket.grantRead(asg);

        /**
         * Defines CodeDeploy application, CodeDeploy handles updating the EC2 host with new code once triggered by Github.
         */

        const application = new codedeploy.ServerApplication(this, 'CodeDeployApplication', {
            applicationName: props.cdApplicationName,
        });

        const deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'CodeDeployDeploymentGroup', {
            application,
            deploymentGroupName: 'OneBoxDeploymentGroup',
            autoScalingGroups: [asg],
            installAgent: true,
            autoRollback: {
                failedDeployment: true,
                stoppedDeployment: true,
                // deploymentInAlarm: true, //TODO setup alarms
            },
        });

        /**
         * CFN Outputs of values that needed to be set in the GitHub repo for easy access.
         */
        new CfnOutput(this, 'IAMROLE_GITHUB', { value: githubActionsRole.role.roleArn });
        new CfnOutput(this, 'S3BUCKET', { value: deploymentBucket.bucketArn });
        new CfnOutput(this, 'AWS_REGION', { value: this.region });
        new CfnOutput(this, 'CODE_DEPLOY_APPLICATION', { value: application.applicationName });
        new CfnOutput(this, 'DEPLOYMENT_GROUP', { value: deploymentGroup.deploymentGroupName });
    }
}