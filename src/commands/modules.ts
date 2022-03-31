export interface ModulesCommandArguments {
  sourceURL: string;
}

export default async function modulesCommand({
  sourceURL,
}: ModulesCommandArguments) {
  console.log(sourceURL);
}
