# Deploy to AWS EC2 automatically from Github
This project provides a starting point for deploying an application onto AWS EC2 which will automatically be updated whenever its corresponding Github repository is changed. 

The application in this example uses NodeJS and its Github repository is here: https://github.com/CharlesKozel/GithubCodedeployDemo 

**Note:** the network configuration of this CDK code only allows outgoing connections, useful for say a Discord bot, but would need to be modified for a web hosting.

 **That Repo** is the example repo that when a change is pushed to **main** branch, will automatically deploy that change to the EC2 host running the application. It includes the essencial code to deploy and run the application on EC2.

![](https://1.bp.blogspot.com/-K7rSzDdhHKo/YPwgtnnpcUI/AAAAAAAABlo/WoKcI8fa0ME749YOxWFYUDtaSCxcyklfwCLcBGAsYHQ/s720/1_ud2T-tKYh-ZM7juhyVXInw.png)

[**AWS CDK**](https://docs.aws.amazon.com/cdk/v2/guide/home.html) is used to define and create all of the necessary resources in the AWS Cloud. The tutorial below assumes zero knowledge of AWS and thaks to **CDK** very little direct interaction with AWS is needed. 

## Costs
A *T3 Micro* instance is used which falls under AWS FreeTier's 750 hours/month of free usage, so the host itself is free. Their may be incendental charges for storing the deployment artifacts in S3 or running the deployments with CodeDeploy but that should be under a dollar.

# Tutorial
This tutorial assumes you have zero knowledge of AWS and are starting from scratch. However you should have a solid grasp on programming and be reasonably comfortable using a command line.

(If you found your way here and already know what AWS CDK, just look at the source code)

## 1. Create AWS Account
[Follow the link](https://aws.amazon.com/free), fill the forms, click the buttons, you will need a credit card. Do make a good password, you don't want someone crypto-mining on your dollar.

**PRO TIP:** If you want multiple AWS accounts under the same e-mail adress, add a "`+some-string`" before the `@` in your e-mail address to create unique emails that all go to the same inbox. ex: jdoe+my-aws-app@gmail.com 

### Setup Single Sign-On

This step enables the easiest and most secure way to authorize the AWS CLI, used later. 

Goto the AWS Management Console https://console.aws.amazon.com/ and sign in as the root user.

Change the region in the top right corrner to the primary region you intend to use. Regions are where in the world your resources are physically hosted, choose the closest location to you.

Search **IAM Identity Center** in the search bar and goto that page. Click **Enable** and then **Create AWS organization**. 

Now from the IAM Identity Center console: 
* Click **Users** on the left menu, then **Add User**. Create a new account here, you can use the same e-mail as before. Skip adding to a group and finalize, you will recieve an email to create your password.

* Click **Groups** on the left menu, then **Create Group**. Create a group named "Admin", and add the user you created to that group.

* Click **Permission sets** under Multi-account permissions on the left menu, then **Create permission set**. Choose "Predefined permission set" and select "AdministratorAccess" as the policy. Go with the defaults on the next screen, and create it.

* Click **AWS accounts** on the left menu, select your account, **Assign users or groups**, select "Admin", select "AdministratorAccess" permission set, submit. 

* Click **Dashboard** on the left menu, under "Settings summary" is your "AWS Access protal URL". Click that link and **>bookmark it<**, this is where you sign in to use your account from now on.

Think of the first account as the billing/root account, and the one you created on the IAM Identity Center as your normal working account, which comes with the benefits of web based CLI authorization.


## 2. Install the AWS CLI
The AWS CLI is a utility that helps you interact with AWS in a terminal. Commands for Windows and Mac package managers included, package managers make installing command line software much easier. 

#### Chocolatey (Windows)
Install Chocolatey https://chocolatey.org/install then:
> choco install awscli

https://community.chocolatey.org/packages/awscli

#### Homebrew (Mac)
Install Homebrew: https://brew.sh/ then:
> brew install awscli

#### Linux
With the package manager of your choice install `awscli`

#### Manually (All)
If you don't use a package manager [official documentation here](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html), but dude, use a package manager.

### Confirm It Works
Type `aws` in your terminal and you shoud see help instructions.

### Authorize the CLI
Run the following cli command to configure web based authentication, you will need the URL you used to sign in to the second account you created. During this process you will be taken to your web browser to authorize the AWS CLI to use your account.

    aws configure sso   
    SSO session name (Recommended): admin
    SSO start URL [None]: https://**{{URL_YOU_BOOKMARKED}}**.awsapps.com/start
    SSO region [None]: us-east-2
    SSO registration scopes [sso:account:access]:
    Attempting to automatically open the SSO authorization page in your default browser.
    ...
    The only AWS account available to you is: XXXXXXXXXXXX
    Using the account ID XXXXXXXXXXXX
    The only role available to you is: AdministratorAccess
    Using the role name "AdministratorAccess"
    CLI default client Region [None]: us-east-2
    CLI default output format [None]:
    CLI profile name [AdministratorAccess-XXXXXXXXXXXX]: admin

### ReAuthorize CLI
After 1 hour (or 12 not sure) the credentials will expire, to use the AWS CLI again run:

    aws sso login --sso-session admin

## 3. Install NodeJS & Git
AWS CDK uses NodeJS, so we need it if you don't already have it installed, use your package manager, or: https://nodejs.org/en/download

Same goes for git: https://github.com/git-guides/install-git

## 4. Checkout THIS repository
Create a folder somewhere reasonable like your home directory 

    cd ~/
    mkdir workspace
    cd workspace
    mkdir aws-github
    cd aws-github

Clone THIS repo

     git clone https://github.com/CharlesKozel/GithubDeployedEc2App-CDK.git
     cd GithubDeployedEc2App-CDK


## 5. Edit Files

Edit `bin/github_deployed_ec2_app-cdk.ts` to change the **repo** and **cdApplicationName** to personal values. You must create your own repo for this to work for your account, clone [The Example Repo Here](https://github.com/CharlesKozel/GithubCodedeployDemo). The GitHub Actions workflow setup is discussed there.

Change **cdApplicationName** to whatever your application running on EC2 will do.

## 6. Deploy AWS Resources with CDK
AWS CDK provides a way to define/update cloud infrastructure through writing TypeScript code (as opposed to manually online or XML/JSON configuration files). You can examine the resources that will be created by opening `lib/github-deployed-ec2-app-stack.ts`.

To use CDK in the terminal you must install it with NPM

> npm install -g aws-cdk

In the root directory of the repository install NodeJS dependencies with:

> npm install

To build the CDK code, run:

> cdk synth

You must 'bootstrap' CDK once for each region/account you want to use. Where "admin" is the name of the AWS profile your using.

> cdk --profile=admin bootstrap

To deploy the EC2 host, and Code Deploy resources to AWS run:

cdk --profile=admin deploy

If all goes well, you now have an EC2 virtual machine awaiting deployment from GitHub! 

Now we just need to point GitHub to our newly created resources, to do that checkout the [Corresponding Example Repository](https://github.com/CharlesKozel/GithubCodedeployDemo) for instructions.

## 7. Debugging on EC2 Host
To run commands on the EC2 host you deployed, sign in to the AWS Console using the URL you bookmarked. Search EC2 in the searchbar and go to the EC2 console.

Select **Instances (running)** 

Select the 1 instance that was deployed, click **connect** and use Systems Manager to connect using a web terminal. 

You can run commands on the host using this terminal, to debug your application or deployment issues.