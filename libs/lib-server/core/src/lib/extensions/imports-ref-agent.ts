import { ContributionType } from '@flogo-web/core';

/**
 * Helper to convert an aliased ref using `#ref` syntax to full package ref for example `github.com/project-flogo/`
 */
export interface ImportsRefAgent {
  /**
   * Translate aliased ref (`#ref`) to package ref `github.com/path/to/full/package-ref`
   *
   * @example
   *  if there is an import registered as "github.com/project-flogo/contrib/activity/rest"
   *  importAgent.getPackageRef(ContributionType.Activity, '#rest')
   *  // outputs github.com/project-flogo/contrib/activity/rest
   *
   *  @example
   *  if there is an import registered as "myAliasedLog github.com/project-flogo/contrib/activity/log"
   *  importAgent.getPackageRef(ContributionType.Activity, '#myAliasedLog')
   *  // outputs github.com/project-flogo/contrib/activity/log
   * @param contribType
   * @param aliasRef
   */
  getPackageRef(contribType: ContributionType, aliasRef: string): string;
}