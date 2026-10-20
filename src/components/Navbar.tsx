import React from 'react';
import { Sidebar, SidebarProps, NavTab } from './Sidebar';

export type { NavTab, SidebarProps as NavbarProps };

export const Navbar: React.FC<SidebarProps> = (props) => {
  return <Sidebar {...props} />;
};

export default Navbar;
