
# aws-dva-c02-quiz
AI Slop app that helps students pass their DVA C02 exam. (Questions created with the use of AI, take note.)

# Smart(er) Quiz

This will prioritise the questions that you have not yet "mastered" (answered correctly 4 times) and will focus on the domain you score the least in. It uses local storage to persist your data, if you want to start again clear your localstorage keys.

# Questions

The questions are loaded from a json object, the questions need to be in the format:

``` 
[
{
    "id": 1,
    "domain": "Development with AWS Services",
    "question": "A developer needs to implement a locking mechanism to ensure only one worker process at a time can process a specific record in an Amazon DynamoDB table. Which feature should be used?",
    "options": [
      "Atomic Counters",
      "Optimistic Locking with Version Provider",
      "Pessimistic Locking using API Gateway",
      "Scan operations with Segmented access"
    ],
    "correct": [1],
    "explanation": "DynamoDB uses optimistic locking via a 'version attribute' and Conditional Expressions to ensure an item hasn't changed since it was read."
  }
]
```

# Customize

You can ask AI to produce a set of questions and answers for any topic as long as it follows the JSON structure above.

# Hosting

This will work by running it locally in Dev. You don't need to host it to revise.

