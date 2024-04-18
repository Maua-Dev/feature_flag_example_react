import * as cdk from "aws-cdk-lib";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import path = require("path");

export class FeatureFlagsStack {    
    constructor(stack : cdk.Stack) {

        const stage = process.env.GITHUB_REF_NAME || 'dev';
        const projectName = process.env.PROJECT_NAME || 'ViteReactTemplateFront';
        
        const app = new cdk.aws_appconfig.Application(stack, projectName + "App");
        const env = new cdk.aws_appconfig.Environment(stack, stage, {
            application: app
        });
        
        new cdk.aws_appconfig.HostedConfiguration(stack, projectName + "Config", {
            application: app,
            deployTo: [env],
            content: cdk.aws_appconfig.ConfigurationContent.fromInlineText(projectName + "Config"),
            type: cdk.aws_appconfig.ConfigurationType.FEATURE_FLAGS,
            deploymentStrategy: new cdk.aws_appconfig.DeploymentStrategy(stack, projectName + "DeploymentStrategy", {
                rolloutStrategy: cdk.aws_appconfig.RolloutStrategy.LINEAR_50_PERCENT_EVERY_30_SECONDS
            })
        })

        const appConfig = LayerVersion.fromLayerVersionArn(stack, projectName + "AppConfigLayer", "arn:aws:lambda:sa-east-1:000010852771:layer:AWS-AppConfig-Extension:128")

        const fn = new cdk.aws_lambda.Function(stack, projectName + "Lambda", {
            layers: [appConfig],
            runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
            handler: "lambda-handler.handler",
            code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, "../../lambda")),
        })

        fn.role?.addManagedPolicy(cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/StartConfigurationSession"))
        fn.role?.addManagedPolicy(cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/GetLatestConfiguration"))
        fn.role?.addManagedPolicy(cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/GetConfiguration"))        
    }
}