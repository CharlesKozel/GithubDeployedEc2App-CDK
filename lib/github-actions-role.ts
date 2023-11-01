import { Construct } from "constructs";
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Basec on https://github.com/cdklabs/cdk-pipelines-github/blob/aee048848be03dba8884d16c652282102987a7c8/src/oidc-provider.ts
 * Uses OpenID Connect to authorize Github to take actions in your AWS account.
 */

export interface GithubActionsRoleProps {
    repo: string;
}

export class GithubActionsRole extends Construct {
    public readonly role: iam.IRole;

    constructor(scope: Construct, id: string, props: GithubActionsRoleProps) {
        super(scope, id);

        const oidcProvider = new iam.OpenIdConnectProvider(this, 'github-provider', {
            url: 'https://token.actions.githubusercontent.com',
            clientIds: ['sts.amazonaws.com'],
            thumbprints: GITHUB_OIDC_THUMBPRINTS,
        });

        const codeDeployPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'codedeploy:Get*',
                'codedeploy:Batch*',
                'codedeploy:CreateDeployment',
                'codedeploy:RegisterApplicationRevision',
                'codedeploy:List*'
            ],
            resources: ['*'],
        });

        this.role = new iam.Role(this, 'GithubActionsRole', {
            assumedBy: new iam.FederatedPrincipal(
                oidcProvider.openIdConnectProviderArn,
                {
                    StringLike: {
                        [`token.actions.githubusercontent.com:sub`]: [`repo:${props.repo}:*`],
                    },
                },
                'sts:AssumeRoleWithWebIdentity',
            ),
            inlinePolicies: {
                AssumeBootstrapRoles: new iam.PolicyDocument({
                    statements: [codeDeployPolicy],
                }),
            },

        });
    }
}

/**
 * GitHub OIDC thumbprints updated 2023-07-27
 *
 * https://github.blog/changelog/2023-06-27-github-actions-update-on-oidc-integration-with-aws/
 */
const GITHUB_OIDC_THUMBPRINTS = [
    '6938fd4d98bab03faadb97b34396831e3780aea1',
    '1c58a3a8518e8759bf075b76b750d4f2df264fcd',
];