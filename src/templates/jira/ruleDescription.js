const getRuleDescription = ruleName => {
  switch (ruleName) {
    case 'GR0001':
      return `SQL injections are dangerous because they can be easily identified by attackers.
Hackers can use SQL injections to read from and sometimes even write to your
database. SQL injections are very common and have been the cause of many
high-profile breaches. Check out [this video|https://www.youtube.com/watch?v=oLahd_ksX6c] for a high-level explanation.`;
    case 'GR0002':
      return `Every programming language has dangerous functions. If these functions are not used properly, it can have a catastrophic impact on your app. Attacker controlled input, that is processed by any of these functions, can lead to attackers getting full access to your production environment.
An explainer video for one example of such dangerous functions can be viewed [here|https://www.youtube.com/watch?v=PxFccbkW8TQ].`;
    case 'GR0003':
      return 'Regular Expressions (Regex) are used in almost every application. Less known is the fact that a Regex can lead to Denial of Service (DOS) attacks, called ReDOS. This is due to the fact that regex engines may take a large amount of time when analyzing certain strings, depending on how the regex is defined.  Therefore, it is possible that a single request may cause a large amount of computation on the server side.';
    case 'GR0004':
      return ` All modern applications rely on certain secrets to run. These secrets may be database connection strings, API keys, or cryptographic keys. Keeping these secrets safe is critical to the security of the application.

If secrets are part of your source code, then the whole team has access to them. Worse, if the code is public, then everyone has access to them. Code can be public, if it's on a public Github repository, or bundled with your application, e.g. your Android app. This has led to many high profile breaches.`;
    case 'GR0005':
      return 'Authentication is one of the most fundamental security requirements. Any issues with authentication can allow attackers to bypass business logic and impersonate users, or even access all data from other users. Check out [this video|https://www.youtube.com/watch?v=XUoh5KHoqXU] for a high-level explanation.';
    case 'GR0006':
      return `Access Control is one of the most fundamental security requirements. Any
problems with managing access control can allow attackers to bypass business
logic and access data from other users. Check out [this video|https://www.youtube.com/watch?v=Mq7svP7J2YY] for a high-level explanation.`;
    case 'GR0007':
      return 'Modern programming languages and frameworks mostly adhere to secure defaults, but there are always ways to introduce configuration issues. Check out [this video|https://www.youtube.com/watch?v=iSYD7vOlSJs] for a high-level explanation.';
    case 'GR0008':
      return `Any functionality related to file management requires careful usage. If attackers are able to influence the input to file access related APIs, then it can have a serious impact. For example, attackers could read all files on your application server.

In other cases, this can allow attackers to include their own code, or files, that are then executed by the application at runtime. Check out [this video|https://www.youtube.com/watch?v=WK1JRaHikC8] for a high-level explanation on **local** file inclusion issues and [this one|https://www.youtube.com/watch?v=1RqALg__Q2A] for a high-level explanation on **remote** file inclusion issues.`;
    case 'GR0009':
      return `Cryptography is hard. And when it is used in an application, it's usually to make sure user data is secure in transit and at rest. Unfortunately, cryptographic libraries are not always easy to use.
They require proper configuration and settings to ensure the data is safe. Check out [this video|https://www.youtube.com/watch?v=wJOoUswXuRc] for a high-level explanation.`;
    case 'GR0010':
      return 'Most modern programming languages have powerful or security related APIs. If these APIs are not used properly, it can have a catastrophic impact on your app.';
    case 'GR0011':
      return `This vulnerability category deals with how user input is processed by certain APIs, which can result in a range of security issues. The following categories are covered: 
- [Cross-Site Scripting|https://owasp.org/www-community/attacks/xss/]
- [Insecure Deserialization|https://owasp.org/www-project-top-ten/OWASP_Top_Ten_2017/Top_10-2017_A8-Insecure_Deserialization]
- [Buffer overflows|https://owasp.org/www-community/vulnerabilities/Buffer_Overflow]
- [Format Strings|https://owasp.org/www-community/attacks/Format_string_attack]`;
    case 'GR0012':
      return 'Ensuring that the data in transit is secured between users and your application is the most fundamental security requirement. If this security control is not in place then all bets are off and attackers have many ways to attack your users. Check out [this video|https://www.youtube.com/watch?v=ZKzlDwRUDbQ] for a high-level explanation.';
    case 'GR0013':
      return 'Most of the code for modern applications is coming from third-party libraries. This is great because it speeds up development. However, there is no guarantee that third-party libraries are secure and of high quality. Check out [this video|https://www.youtube.com/watch?v=UVW1YhzfYUY] for a high-level explanation.';
    default:
      return '';
  }
};

module.exports = getRuleDescription;
