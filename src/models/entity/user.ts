import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"
@Entity({name:"user"})
export default class User {
    @PrimaryGeneratedColumn({type: "bigint"})
    id!: string;

    @Column()
    email: string

    @Column()
    password: string

    @Column({name:"username"})
    userName: string

    @Column()
    name:string

    @Column()
    lang:string

    constructor(email: string, password: string, userName: string,name:string,lang:string) {
        this.email = email;
        this.password = password;
        this.userName = userName;
        this.name=name;
        this.lang=lang;
      }
}