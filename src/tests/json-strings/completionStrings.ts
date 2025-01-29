export const document1 = `
{
    "StartAt":,
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next":,
      },
      "ChoiceStateX": {
        "Type": "Choice",
        "Choices": [
          {
            "Next": ""
          },
          {
            "Next": "FirstState"
          },
          {
            "Next": "NextState"
          }
        ],
        "Default": ""
      },
    }
  }
`

export const document2 = `
{
    "StartAt": ,
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": ,
      },
      "ChoiceStateX": {
        "Type": "Choice",
        "Choices": [
          {
            "Next": ""
          },
          {
            "Next": "FirstState"
          },
          {
            "Next": "NextState"
          }
        ],
        "Default":
      },
    }
  }
`

export const document3 = `
{
    "StartAt": ",
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": ",
      },
      "ChoiceStateX": {}
    }
  }
`

export const document4 = `
{
    "StartAt": "",
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": "",
      },
      "ChoiceStateX": {}
    }
  }
`
export const document5 = `
{
  "StartAt": "First",
  "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": "First",
      },
      "ChoiceStateX": {}
  }
}
`

export const document6 = `
{
  "StartAt": "First",
  "States": {
      "FirstState": {
        "Type": "Task"
      },
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {
        "Next": "First",
      },
      "Success State": {}
  }
}
`

export const documentNested = `
{
  "StartAt": "First",
  "States": {
      "FirstState": {},
      "MapState": {
        "Iterator": {
          "StartAt":,
          "States": {
            "Nested1": {},
            "Nested2": {},
            "Nested3": {},
            "Nested4": {
              "Next":,
            },
          }
        },
      },
  }
}
`
export const completionsEdgeCase1 = `{
  "Comment": "An example of the Amazon States Language using a map state to process elements of an array with a max concurrency of 2.",
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": """"$$$$$.array$$$",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "Iterator": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "Result": "Done!",
                      "End": true
                  }
              }
          }
      },
      "
      "Net 2": {
          "Type": "Fail",
          "Next": "Final State"
      },
      "Final State": {
          "Type": "Pass",
          "Next": "Net 2"
      }
  }
}`

export const completionsEdgeCase2 = `{
  "StartAt": "MyState",
  "States": {
      "
  }
}`

export const itemLabels = [
  'FirstState',
  'ChoiceState',
  'FirstMatchState',
  'SecondMatchState',
  'DefaultState',
  'NextState',
  'ChoiceStateX',
]
export const nestedItemLabels = ['Nested1', 'Nested2', 'Nested3', 'Nested4']
