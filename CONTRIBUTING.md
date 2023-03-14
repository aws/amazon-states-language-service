# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary
information to effectively respond to your bug report or contribution.


## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The version of our code being used
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment


## Contributing via Pull Requests
Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the *master* branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Ensure local tests pass.
4. Commit to your fork using clear commit messages.
5. Send us a pull request, answering any default questions in the pull request interface.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).


## Finding contributions to work on
Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any 'help wanted' issues is a great place to start.

## Getting Started
### Setup
To work on this project you need these environmental dependencies:
-   [NodeJS and NPM](https://nodejs.org/) (latest version of both)
-   [Git](https://git-scm.com/downloads)
-   [AWS `git secrets`](https://github.com/awslabs/git-secrets)

Then clone the repository and install the project dependencies with NPM:

```
git clone git@github.com:aws/amazon-states-language-service.git
cd amazon-states-language-service
npm install
npm test
```

### Debug
The [AWS Toolkit for Visual Studio
Code](https://github.com/aws/aws-toolkit-vscode) extension uses the
`amazon-states-language-service` language service to provide syntax validation &
autocomplete for state machines.

If you want to test or troubleshoot changes you are making to this service
locally with the Visual Studio Code extension, this is how you link the two
repos locally.

1) In your `amazon-states-language-service` repo root, run:
```
# make current project directory available for linking
npm link
```

2) In your `aws-toolkit-vscode` repo root, run:
```
# link current project to the local language service
npm link amazon-states-language-service

# optional. verify amazon-states-language-service dependency pointing to your 
# local disk location rather than the live service
npm ls amazon-states-language-service
```

### Run
You can now run the `aws-toolkit-vscode` extension from Visual Studio Code while
calling your local development version of `amazon-states-language-service`:

1. Select the Run panel from the sidebar.
2. From the dropdown at the top of the Run pane, choose `Extension`.
3. Press `F5` to launch a new instance of Visual Studio Code with the extension
   installed and the debugger attached.
4. At this point `aws-toolkit-vscode` is using your local copy of the
   `amazon-states-language-service` on disk.
5. If you want to debug/step-through the attached service, in this same instance
   of VS Code with `aws-toolkit-vscode` open and running, go to the dropdown at
   the top of the `Run` pane and select `Attach to ASL Server`.

If you want to reset your `aws-toolkit-vscode` repo to use the live
`amazon-states-language` rather than the local development copy, navigate to
the `aws-toolkit-vscode` repo and do this:

```console
npm unlink amazon-states-language
```

## Code of Conduct
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.


## Security issue notifications
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.


## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.
