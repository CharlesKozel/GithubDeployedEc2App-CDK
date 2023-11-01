#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GithubDeployedEc2AppStack } from '../lib/github-deployed-ec2-app-stack';

const app = new cdk.App();
new GithubDeployedEc2AppStack(app, 'GithubCodedeployCdkStack', {
    repo: 'CharlesKozel/GithubCodedeployDemo',
    cdApplicationName: 'DemoApplication',
});